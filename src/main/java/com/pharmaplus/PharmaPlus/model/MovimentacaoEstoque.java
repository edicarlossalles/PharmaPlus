package com.pharmaplus.PharmaPlus.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "movimentacao_estoque")
public class MovimentacaoEstoque {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long   medicamentoId;
    private String nomeMedicamento;

    private String tipo;

    private int    quantidadeAntes;
    private int    quantidadeDepois;
    private String statusAntes;
    private String statusDepois;

    private String responsavel;
    private String observacao;

    private LocalDateTime dataHora;

    @PrePersist
    public void prePersist() {
        this.dataHora = LocalDateTime.now();
    }
}
