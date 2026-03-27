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

    private String categoria;

    private int quantidade;

    private LocalDate validade;

    private String prateleira;

    private String status;
}
