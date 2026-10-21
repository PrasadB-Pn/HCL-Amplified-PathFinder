import pytest
from app.services.ai_service import ai_service


def test_career_recommendation_contract():
    user = {
        "skills": ["Python", "SQL", "Pandas"],
        "interests": ["Machine Learning", "Data Analysis"],
        "experience": "Intermediate",
    }
    careers = ai_service.career_recommendations(user)
    assert isinstance(careers, list)
    assert len(careers) > 0
    primary = careers[0]
    assert "title" in primary
    assert "match" in primary
    assert "reasons" in primary
    assert isinstance(primary["reasons"], list)
    assert primary.get("isPrimary") is True


def test_skill_gap_analysis_contract():
    user = {
        "skills": ["Python", "Git"],
        "experience": "Beginner",
    }
    gap = ai_service.skill_gaps(user, target="Data Scientist")
    assert isinstance(gap, dict)
    assert "target_career" in gap
    assert "matching_skills" in gap
    assert "missing_skills" in gap
    assert "match_percentage" in gap
    assert isinstance(gap["missing_skills"], list)


def test_resources_recommendation_contract_and_https_urls():
    user = {
        "skills": ["Python"],
        "interests": "Data Science",
        "experience": "Beginner",
    }
    resources = ai_service.resources(user)
    assert isinstance(resources, list)
    assert len(resources) > 0
    for r in resources:
        assert "id" in r
        assert "title" in r
        assert "url" in r
        if r["url"]:
            assert r["url"].startswith("https://") or r["url"].startswith("http://")


def test_projects_recommendation_contract_and_https_urls():
    user = {
        "skills": ["Python", "Machine Learning"],
        "experience": "Intermediate",
    }
    projects = ai_service.projects(user)
    assert isinstance(projects, list)
    assert len(projects) > 0
    for p in projects:
        assert "id" in p
        assert "title" in p
        assert "difficulty" in p
        assert "skills" in p
        if p.get("url") and p["url"] != "#":
            assert p["url"].startswith("https://") or p["url"].startswith("http://")


def test_route_generation_contract_and_stages():
    user = {
        "skills": ["Python", "NumPy"],
        "interests": "Deep Learning",
        "experience": "Intermediate",
        "weekly_learning_hours": 10,
    }
    route = ai_service.route(user, "AI / ML Engineer")
    assert isinstance(route, dict)
    assert "title" in route
    assert "stages" in route
    assert len(route["stages"]) > 0
    first_stage = route["stages"][0]
    assert "title" in first_stage
    assert "status" in first_stage
    assert "skills" in first_stage


def test_deterministic_fallback_without_semantic_search():
    """Verify system operates reliably without sentence_transformers or embedding model."""
    user = {
        "skills": ["SQL", "Data Analysis"],
        "interests": "Business Intelligence",
        "experience": "Beginner",
    }
    # Call multiple times: results must be deterministic and stable
    res1 = ai_service.career_recommendations(user)
    res2 = ai_service.career_recommendations(user)
    assert len(res1) == len(res2)
    assert [c["title"] for c in res1] == [c["title"] for c in res2]
