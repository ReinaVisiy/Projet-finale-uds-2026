package com.agrycam.messageservice.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageRequest {
    private Long destinataireId;
    private String contenu;
    private String imageData;
}
