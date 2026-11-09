import asyncio
import logging
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import uuid
import datetime

logger = logging.getLogger("tiruppur.database")

# In-Memory Async Mongo Collection for zero-dependency local runs & tests
class InMemoryCursor:
    def __init__(self, docs: List[Dict[str, Any]]):
        self._docs = docs

    def sort(self, key_or_list, direction=1):
        if isinstance(key_or_list, str):
            reverse = direction == -1
            self._docs.sort(key=lambda d: d.get(key_or_list, ""), reverse=reverse)
        elif isinstance(key_or_list, list) and len(key_or_list) > 0:
            k, d = key_or_list[0]
            reverse = d == -1
            self._docs.sort(key=lambda doc: doc.get(k, ""), reverse=reverse)
        return self

    def limit(self, n: int):
        self._docs = self._docs[:n]
        return self

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        if length is not None:
            return [dict(d) for d in self._docs[:length]]
        return [dict(d) for d in self._docs]

    def __aiter__(self):
        self._iter = iter(self._docs)
        return self

    async def __anext__(self):
        try:
            return dict(next(self._iter))
        except StopIteration:
            raise StopAsyncIteration

class InMemoryCollection:
    def __init__(self, name: str):
        self.name = name
        self._documents: Dict[str, Dict[str, Any]] = {}

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        for k, v in query.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._matches(doc, subq) for subq in v):
                    return False
            elif isinstance(v, dict):
                # Simple operator support ($in, $ne, $gte, etc.)
                doc_val = doc.get(k)
                if "$in" in v and doc_val not in v["$in"]:
                    return False
                if "$ne" in v and doc_val == v["$ne"]:
                    return False
                if "$gte" in v and (doc_val is None or doc_val < v["$gte"]):
                    return False
                if "$lte" in v and (doc_val is None or doc_val > v["$lte"]):
                    return False
            else:
                if doc.get(k) != v:
                    return False
        return True

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for doc in self._documents.values():
            if self._matches(doc, query):
                return dict(doc)
        return None

    def find(self, query: Optional[Dict[str, Any]] = None, sort=None) -> InMemoryCursor:
        query = query or {}
        matches = [dict(d) for d in self._documents.values() if self._matches(d, query)]
        cursor = InMemoryCursor(matches)
        if sort:
            cursor.sort(sort)
        return cursor

    async def insert_one(self, doc: Dict[str, Any]):
        doc_copy = dict(doc)
        if "_id" not in doc_copy:
            doc_copy["_id"] = str(uuid.uuid4())
        doc_id = str(doc_copy["_id"])
        self._documents[doc_id] = doc_copy
        class InsertResult:
            inserted_id = doc_id
        return InsertResult()

    async def insert_many(self, docs: List[Dict[str, Any]]):
        ids = []
        for d in docs:
            res = await self.insert_one(d)
            ids.append(res.inserted_id)
        class ManyResult:
            inserted_ids = ids
        return ManyResult()

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        for doc_id, doc in self._documents.items():
            if self._matches(doc, query):
                if "$set" in update:
                    for k, v in update["$set"].items():
                        doc[k] = v
                if "$push" in update:
                    for k, v in update["$push"].items():
                        if k not in doc or not isinstance(doc[k], list):
                            doc[k] = []
                        doc[k].append(v)
                self._documents[doc_id] = doc
                class UpdateResult:
                    matched_count = 1
                    modified_count = 1
                return UpdateResult()
        class EmptyUpdateResult:
            matched_count = 0
            modified_count = 0
        return EmptyUpdateResult()

    async def delete_one(self, query: Dict[str, Any]):
        for doc_id, doc in list(self._documents.items()):
            if self._matches(doc, query):
                del self._documents[doc_id]
                class DelResult:
                    deleted_count = 1
                return DelResult()
        class EmptyDelResult:
            deleted_count = 0
        return EmptyDelResult()

    async def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        query = query or {}
        return sum(1 for d in self._documents.values() if self._matches(d, query))

    async def delete_many(self, query: Optional[Dict[str, Any]] = None):
        query = query or {}
        count = 0
        for doc_id, doc in list(self._documents.items()):
            if self._matches(doc, query):
                del self._documents[doc_id]
                count += 1
        class ManyDel:
            deleted_count = count
        return ManyDel()

class InMemoryDatabase:
    def __init__(self):
        self._collections: Dict[str, InMemoryCollection] = {}

    def __getitem__(self, name: str) -> InMemoryCollection:
        if name not in self._collections:
            self._collections[name] = InMemoryCollection(name)
        return self._collections[name]

    def get_collection(self, name: str) -> InMemoryCollection:
        return self[name]


# Global state
client: Optional[Any] = None
db: Optional[Any] = None
is_in_memory: bool = False

async def init_db():
    global client, db, is_in_memory
    uri = settings.MONGODB_URI.strip()
    
    if uri:
        # Configure resilient DNS resolution for mongodb+srv across local Wi-Fi / VPN networks
        try:
            import dns.resolver
            resolver = dns.resolver.Resolver()
            resolver.nameservers = ['8.8.8.8', '1.1.1.1', '8.8.4.4']
            dns.resolver.default_resolver = resolver
        except Exception:
            pass

        # 1. Attempt connection with certifi CA bundle (resolves TLSV1_ALERT_INTERNAL_ERROR on Windows & Cloud)
        try:
            import certifi
            logger.info("Connecting to MongoDB Atlas with certifi CA bundle...")
            client = AsyncIOMotorClient(
                uri,
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000
            )
            await client.admin.command('ping')
            db = client[settings.DB_NAME]
            is_in_memory = False
            logger.info("Successfully connected to live MongoDB Atlas!")
            return db
        except Exception as e1:
            logger.warning(f"Connection with certifi CA bundle failed: {e1}. Retrying with TLS fallback...")

        # 2. Attempt connection with permissive TLS if enterprise proxy/VPN interferes
        try:
            client = AsyncIOMotorClient(
                uri,
                tlsAllowInvalidCertificates=True,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000
            )
            await client.admin.command('ping')
            db = client[settings.DB_NAME]
            is_in_memory = False
            logger.info("Successfully connected to live MongoDB with TLS fallback!")
            return db
        except Exception as e2:
            logger.warning(f"Could not connect to live MongoDB: {e2}. Falling back to zero-config in-memory store.")
    
    # Fallback to in-memory store
    logger.info("Initializing zero-config In-Memory MongoDB engine for development/reviewer environment.")
    db = InMemoryDatabase()
    is_in_memory = True
    return db

def get_database():
    global db
    if db is None:
        # Emergency synchronous fallback
        db = InMemoryDatabase()
    return db

