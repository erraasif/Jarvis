# Extract token information
    access_token = result.get("access_token")
    refresh_token = result.get("refresh_token")
    expires_in = result.get("expires_in", 3600)  # Passes raw integer seconds (e.g. 3600)

    # Fetch user identity from Microsoft Graph
    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        user_res = httpx.get("https://graph.microsoft.com/v1.0/me", headers=headers, timeout=10.0).json()
        user_email = user_res.get("mail") or user_res.get("userPrincipalName")
    except Exception as exc:
        logger.error(f"Failed to fetch user profile from Microsoft Graph: {exc}")
        raise HTTPException(status_code=500, detail="Failed to fetch user profile.")

    if not user_email:
        raise HTTPException(status_code=400, detail="Could not determine user email from Graph response.")

    # Save tokens to database (passes expires_in as integer)
    save_user_tokens(user_email, access_token, refresh_token, expires_in)