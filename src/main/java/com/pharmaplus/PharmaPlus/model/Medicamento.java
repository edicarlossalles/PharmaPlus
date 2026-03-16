package com.pharmaplus.PharmaPlus.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "medicamento")
@Data
@NoArgsConstructor
public class Medicamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    // "Controlado" ou "Não Controlado"
    private String categoria;

    // Quantidade de caixas na prateleira
    private int quantidade;

    private LocalDate validade;

    // Ex: "A3 - Fileira 2"
    private String prateleira;

    // "Disponível" = na prateleira | "Estoque" = só no estoque
    private String status;
}
