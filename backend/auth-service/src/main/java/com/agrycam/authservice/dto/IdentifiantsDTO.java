package com.agrycam.authservice.dto;

import java.time.LocalDateTime;
import java.util.List;

public record IdentifiantsDTO(
    Long uid,
    String email,
    String passwordHash,
    List<String> roles,
    LocalDateTime suspenduJusquau,
    boolean emailConfirme
) {}
