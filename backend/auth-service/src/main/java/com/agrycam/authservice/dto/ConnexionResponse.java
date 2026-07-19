package com.agrycam.authservice.dto;

import java.util.List;

public record ConnexionResponse(
    String token,
    String tokenType,
    Long uid,
    String email,
    List<String> roles
) {}
