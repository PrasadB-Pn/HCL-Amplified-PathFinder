import pytest


@pytest.mark.asyncio
async def test_profile_update_and_get(client, auth_headers):
    update_data = {
        "name": "Jane Developer",
        "target_career": "AI / ML Engineer",
        "experience": "Intermediate",
        "skills": ["Python", "SQL"],
        "interests": ["Machine Learning", "Computer Vision"],
        "weekly_learning_hours": 10,
        "onboarding_completed": True,
    }
    put_res = await client.put("/users/me", json=update_data, headers=auth_headers)
    assert put_res.status_code == 200
    profile = put_res.json()
    assert profile["name"] == "Jane Developer"
    assert profile["target_career"] == "AI / ML Engineer"
    assert profile["skills"] == ["Python", "SQL"]
    assert profile["weekly_learning_hours"] == 10

    get_res = await client.get("/users/me", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Jane Developer"


@pytest.mark.asyncio
async def test_route_generation_and_ownership(client, registered_user, auth_headers):
    # Setup user profile with skills
    await client.put("/users/me", json={
        "target_career": "AI / ML Engineer",
        "skills": ["Python"],
        "weekly_learning_hours": 8,
    }, headers=auth_headers)

    gen_res = await client.post("/routes/generate", json={"career_title": "AI / ML Engineer"}, headers=auth_headers)
    assert gen_res.status_code == 200
    route = gen_res.json()
    assert "id" in route
    assert "AI" in route["title"] and "Engineer" in route["title"]
    assert len(route["stages"]) > 0
    route_id = route["id"]

    # Verify user can get their own route
    get_res = await client.get(f"/routes/{route_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == route_id

    # Register second user
    res2 = await client.post("/auth/register", json={
        "name": "Bob Intruder",
        "email": "bob@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!",
    })
    token2 = res2.json()["token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # Second user CANNOT access User 1's route (strictly returns 404)
    forbidden_get = await client.get(f"/routes/{route_id}", headers=headers2)
    assert forbidden_get.status_code == 404

    # Second user CANNOT delete User 1's route
    forbidden_delete = await client.delete(f"/routes/{route_id}", headers=headers2)
    assert forbidden_delete.status_code == 404

    # Second user's route list is empty
    list_res = await client.get("/routes", headers=headers2)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 0


@pytest.mark.asyncio
async def test_progress_persistence_and_stage_completion(client, auth_headers):
    # Initial progress
    init_res = await client.get("/progress", headers=auth_headers)
    assert init_res.status_code == 200
    prog = init_res.json()
    assert prog["skills_completed"] == 0
    assert prog["percentage"] == 0

    # Complete a stage
    comp_res = await client.post("/progress/complete-stage", json={"stage_id": "stage-1"}, headers=auth_headers)
    assert comp_res.status_code == 200
    updated_prog = comp_res.json()
    assert updated_prog["skills_completed"] == 1
    assert "stage-1" in updated_prog["completed_stages"]
    assert updated_prog["percentage"] > 0

    # Log learning activity
    act_res = await client.post("/progress/activity", json={
        "hours": 2.5,
        "activity_type": "course",
        "description": "Completed Python foundations",
    }, headers=auth_headers)
    assert act_res.status_code == 200
    prog_after_act = act_res.json()
    assert prog_after_act["this_week_hours"] == 2.5
    assert prog_after_act["streak"] >= 1
    assert len(prog_after_act["recent_activities"]) == 1
