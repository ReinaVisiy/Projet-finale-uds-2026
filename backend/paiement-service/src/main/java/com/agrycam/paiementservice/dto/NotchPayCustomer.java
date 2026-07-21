package com.agrycam.paiementservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Informations client attendues par NotchPay dans le corps de
 * POST /payments (name, email requis ; phone recommande).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotchPayCustomer {
    private String name;
    private String email;
    private String phone;
}
