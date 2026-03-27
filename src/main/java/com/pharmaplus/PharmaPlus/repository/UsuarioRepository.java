package com.pharmaplus.PharmaPlus.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pharmaplus.PharmaPlus.model.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Usuario findByMatricula(Integer matricula);
}