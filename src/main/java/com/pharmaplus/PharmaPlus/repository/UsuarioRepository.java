package com.pharmaplus.PharmaPlus.repository;

import com.pharmaplus.PharmaPlus.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Object findByMatricula(int attr0);
}
