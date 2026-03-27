package com.pharmaplus.PharmaPlus.repository;

import com.pharmaplus.PharmaPlus.model.MovimentacaoEstoque;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovimentacaoEstoqueRepository extends JpaRepository<MovimentacaoEstoque, Long> {

    List<MovimentacaoEstoque> findByMedicamentoIdOrderByDataHoraDesc(Long medicamentoId);

    List<MovimentacaoEstoque> findTop20ByOrderByDataHoraDesc();
}
