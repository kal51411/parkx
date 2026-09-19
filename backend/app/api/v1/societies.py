from uuid import UUID
from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import CurrentUser, SocietyAdminOnly, DB
from app.models.society import Society, SocietyMember, MemberRole
from app.schemas.society import SocietyCreate, SocietyOut, AddMemberRequest
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.post("/", response_model=SocietyOut, status_code=201)
async def create_society(data: SocietyCreate, current_user: SocietyAdminOnly, db: DB):
    society = Society(
        name=data.name, address=data.address, city=data.city,
        admin_id=current_user.id, total_spaces=data.total_spaces,
        public_spaces=data.public_spaces, contact_phone=data.contact_phone,
        contact_email=data.contact_email,
    )
    db.add(society)
    await db.flush()
    # Auto-add admin as member
    member = SocietyMember(society_id=society.id, user_id=current_user.id, member_role=MemberRole.ADMIN)
    db.add(member)
    return SocietyOut(
        id=str(society.id), name=society.name, address=society.address, city=society.city,
        admin_id=str(society.admin_id), total_spaces=society.total_spaces,
        public_spaces=society.public_spaces, is_active=society.is_active,
        contact_phone=society.contact_phone, contact_email=society.contact_email,
        created_at=society.created_at.isoformat(),
    )


@router.get("/{society_id}", response_model=SocietyOut)
async def get_society(society_id: str, current_user: CurrentUser, db: DB):
    result = await db.execute(select(Society).where(Society.id == UUID(society_id)))
    society = result.scalar_one_or_none()
    if not society:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Society")
    return SocietyOut(
        id=str(society.id), name=society.name, address=society.address, city=society.city,
        admin_id=str(society.admin_id), total_spaces=society.total_spaces,
        public_spaces=society.public_spaces, is_active=society.is_active,
        contact_phone=society.contact_phone, contact_email=society.contact_email,
        created_at=society.created_at.isoformat(),
    )


@router.get("/{society_id}/analytics")
async def society_analytics(society_id: str, current_user: SocietyAdminOnly, db: DB):
    overview = await AnalyticsService.get_owner_overview(db, current_user.id)
    return overview


@router.get("/{society_id}/members")
async def list_members(society_id: str, current_user: SocietyAdminOnly, db: DB):
    result = await db.execute(
        select(SocietyMember).where(SocietyMember.society_id == UUID(society_id))
    )
    members = result.scalars().all()
    return {"items": [
        {"id": str(m.id), "user_id": str(m.user_id), "member_role": m.member_role}
        for m in members
    ]}


@router.post("/{society_id}/members", status_code=201)
async def add_member(society_id: str, data: AddMemberRequest, current_user: SocietyAdminOnly, db: DB):
    member = SocietyMember(
        society_id=UUID(society_id),
        user_id=UUID(data.user_id),
        member_role=MemberRole(data.member_role),
    )
    db.add(member)
    await db.flush()
    return {"id": str(member.id)}
