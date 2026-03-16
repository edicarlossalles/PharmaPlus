package com.pharmaplus.PharmaPlus.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Data
@NoArgsConstructor
@Entity
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(unique = true)
    @NonNull
    private int matricula;
    @NonNull
    private String senha;

    private String nome;
    private String cargo;
    private String email;
}
