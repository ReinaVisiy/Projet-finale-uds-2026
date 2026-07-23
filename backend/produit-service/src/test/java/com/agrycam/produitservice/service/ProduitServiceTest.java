package com.agrycam.produitservice.service;

import com.agrycam.produitservice.client.NotificationServiceClient;
import com.agrycam.produitservice.dto.ProduitRequest;
import com.agrycam.produitservice.entity.Produit;
import com.agrycam.produitservice.repository.CategorieRepository;
import com.agrycam.produitservice.repository.ProduitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests de la logique d'alerte de stock critique : le producteur ne doit
 * etre notifie qu'au moment ou le stock franchit le seuil vers le bas
 * (jamais a chaque commande tant qu'on reste en dessous), et l'alerte doit
 * pouvoir se redeclencher apres un reapprovisionnement.
 */
@ExtendWith(MockitoExtension.class)
class ProduitServiceTest {

    @Mock
    private ProduitRepository produitRepository;
    @Mock
    private CategorieRepository categorieRepository;
    @Mock
    private RestTemplate restTemplate;
    @Mock
    private NotificationServiceClient notificationServiceClient;

    private ProduitService produitService;

    private static final Long PRODUCTEUR_ID = 42L;
    private static final Long PRODUIT_ID = 7L;

    @BeforeEach
    void setUp() {
        produitService = new ProduitService(produitRepository, categorieRepository, restTemplate, notificationServiceClient);
    }

    private Produit produitAvecStock(int stock, boolean alerteDejaEnvoyee) {
        Produit produit = new Produit();
        produit.setId(PRODUIT_ID);
        produit.setNom("Tomates");
        produit.setProducteurId(PRODUCTEUR_ID);
        produit.setStock(stock);
        produit.setAlerteStockEnvoyee(alerteDejaEnvoyee);
        return produit;
    }

    @Test
    void decrementerStock_declencheAlerteLorsDuFranchissementDuSeuil() {
        // Stock 3 -> 1 : franchit le seuil critique (2) vers le bas.
        Produit produit = produitAvecStock(3, false);
        when(produitRepository.findById(PRODUIT_ID)).thenReturn(Optional.of(produit));
        when(produitRepository.save(any(Produit.class))).thenAnswer(inv -> inv.getArgument(0));

        produitService.decrementerStock(PRODUIT_ID, 2);

        assertThat(produit.getStock()).isEqualTo(1);
        assertThat(produit.getAlerteStockEnvoyee()).isTrue();
        verify(notificationServiceClient, times(1))
                .envoyerAlerteStockCritique(PRODUCTEUR_ID, PRODUIT_ID, "Tomates", 1);
    }

    @Test
    void decrementerStock_neRenvoiePasUneDeuxiemeAlerteTantQueLeStockResteSousLeSeuil() {
        // Deja alerte (ex. une commande precedente a fait franchir le
        // seuil) : une nouvelle commande qui fait encore baisser le stock
        // ne doit pas spammer le producteur.
        Produit produit = produitAvecStock(1, true);
        when(produitRepository.findById(PRODUIT_ID)).thenReturn(Optional.of(produit));
        when(produitRepository.save(any(Produit.class))).thenAnswer(inv -> inv.getArgument(0));

        produitService.decrementerStock(PRODUIT_ID, 1);

        assertThat(produit.getStock()).isEqualTo(0);
        verify(notificationServiceClient, never())
                .envoyerAlerteStockCritique(anyLong(), anyLong(), any(), anyInt());
    }

    @Test
    void decrementerStock_nAlerteJamaisSiLeStockResteAuDessusDuSeuil() {
        // Stock 10 -> 5 : reste au-dessus du seuil critique (2).
        Produit produit = produitAvecStock(10, false);
        when(produitRepository.findById(PRODUIT_ID)).thenReturn(Optional.of(produit));
        when(produitRepository.save(any(Produit.class))).thenAnswer(inv -> inv.getArgument(0));

        produitService.decrementerStock(PRODUIT_ID, 5);

        assertThat(produit.getStock()).isEqualTo(5);
        assertThat(produit.getAlerteStockEnvoyee()).isFalse();
        verify(notificationServiceClient, never())
                .envoyerAlerteStockCritique(anyLong(), anyLong(), any(), anyInt());
    }

    @Test
    void modifier_reactiveAlerteQuandLeStockEstReapprovisionneAuDessusDuSeuil() {
        Produit produit = produitAvecStock(0, true);
        when(produitRepository.findById(PRODUIT_ID)).thenReturn(Optional.of(produit));
        when(produitRepository.save(any(Produit.class))).thenAnswer(inv -> inv.getArgument(0));

        ProduitRequest request = ProduitRequest.builder()
                .nom("Tomates")
                .prix(BigDecimal.TEN)
                .stock(20)
                .build();

        produitService.modifier(PRODUIT_ID, request, PRODUCTEUR_ID);

        assertThat(produit.getAlerteStockEnvoyee()).isFalse();
    }

    @Test
    void modifier_neReactivePasLAlerteSiLeReapprovisionnementResteSousLeSeuil() {
        Produit produit = produitAvecStock(0, true);
        when(produitRepository.findById(PRODUIT_ID)).thenReturn(Optional.of(produit));
        when(produitRepository.save(any(Produit.class))).thenAnswer(inv -> inv.getArgument(0));

        ProduitRequest request = ProduitRequest.builder()
                .nom("Tomates")
                .prix(BigDecimal.TEN)
                .stock(1)
                .build();

        produitService.modifier(PRODUIT_ID, request, PRODUCTEUR_ID);

        assertThat(produit.getAlerteStockEnvoyee()).isTrue();
    }
}
