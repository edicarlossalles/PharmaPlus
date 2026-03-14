package com.pharmaplus.PharmaPlus.repository;

import com.pharmaplus.PharmaPlus.model.Medicamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MedicamentoEstoqueRepository extends JpaRepository<Medicamento, Long> {

    @Query("SELECT m FROM Medicamento m WHERE LOWER(m.nome) = LOWER(:nome)")
    Medicamento findByNome(@Param("nome") String nome);
}
