package com.agrycam.authservice.dto;

public record ConnexionRequest(
    String email,
    String password
) {}
