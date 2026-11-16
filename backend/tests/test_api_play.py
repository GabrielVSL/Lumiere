import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from tests.conftest import TestSessionLocal
from app.models.play import Work, Source, MediaFile, LicenseAssessment


@pytest.mark.asyncio
async def test_play_catalog_and_stream():
    # 1. Popula uma obra teste no banco de testes isolado
    async with TestSessionLocal() as session:
        work = Work(
            title="His Girl Friday (Jejum de Amor)",
            original_title="His Girl Friday",
            year=1940,
            runtime_min=92,
            kind="feature",
            published=True,
            overview_pt="Um clássico da comédia screwball americana.",
        )
        session.add(work)
        await session.flush()

        source = Source(
            work_id=work.id,
            provider="archive",
            external_id="his_girl_friday",
            priority=1,
            active=True,
        )
        session.add(source)
        await session.flush()

        media = MediaFile(
            source_id=source.id,
            url="https://archive.org/download/his_girl_friday/his_girl_friday.mp4",
            container="mp4",
            codec="h264",
            height=480,
            last_status=206,
            fail_count=0,
        )
        session.add(media)

        assessment = LicenseAssessment(
            work_id=work.id,
            region="BR",
            status="public_domain",
            rule="lei_9610_art_44_audiovisual",
            confidence="high",
        )
        session.add(assessment)
        await session.commit()
        work_id = work.id

    # 2. Testa o endpoint do catálogo
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/v1/play/catalog?region=BR")
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 1
        item = next(i for i in data["items"] if i["id"] == work_id)
        assert item["title"] == "His Girl Friday (Jejum de Amor)"
        assert item["license"]["status"] == "public_domain"

        # 3. Testa o endpoint de stream manifest
        res_stream = await client.get(f"/v1/play/works/{work_id}/stream?region=BR")
        assert res_stream.status_code == 200
        stream_data = res_stream.json()
        assert stream_data["work_id"] == work_id
        assert len(stream_data["streams"]) >= 1
        assert "archive.org" in stream_data["streams"][0]["url"]
        assert stream_data["license_status"] == "public_domain"

        # 4. Testa o endpoint de facetas agregadas
        res_facets = await client.get("/v1/play/facets")
        assert res_facets.status_code == 200
        facets_data = res_facets.json()
        assert "total_works" in facets_data
        assert "genres" in facets_data
        assert "decades" in facets_data
        assert facets_data["total_works"] >= 1
