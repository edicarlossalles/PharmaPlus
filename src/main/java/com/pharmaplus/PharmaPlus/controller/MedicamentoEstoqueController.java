package com.pharmaplus.PharmaPlus.controller;

import com.pharmaplus.PharmaPlus.model.Medicamento;
import com.pharmaplus.PharmaPlus.repository.MedicamentoEstoqueRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/estoque")
@CrossOrigin(origins = "*")
public class MedicamentoEstoqueController {

    private final MedicamentoEstoqueRepository repository;

    public MedicamentoEstoqueController(MedicamentoEstoqueRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/listar")
    public List<Medicamento> listar() {
        return repository.findAll();
    }

    @PostMapping("/salvar")
    public ResponseEntity<Map<String, Object>> salvar(@RequestBody Medicamento medicamento) {
        if (medicamento.getNome() == null || medicamento.getNome().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                "sucesso", false,
                "mensagem", "Nome do medicamento é obrigatório."
            ));
        }

        Medicamento salvo = repository.save(medicamento);

        return ResponseEntity.ok(Map.of(
            "sucesso", true,
            "mensagem", "Medicamento salvo com sucesso!",
            "id", salvo.getId()
        ));
    }

    @PutMapping("/vender/{id}")
    public ResponseEntity<Map<String, Object>> vender(@PathVariable Long id) {
        Optional<Medicamento> opt = repository.findById(id);

        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of(
                "sucesso", false,
                "mensagem", "Medicamento não encontrado."
            ));
        }

        Medicamento med = opt.get();

        if (med.getQuantidade() <= 0) {
            return ResponseEntity.badRequest().body(Map.of(
                "sucesso", false,
                "mensagem", "Estoque zerado para este medicamento."
            ));
        }

        med.setQuantidade(med.getQuantidade() - 1);

        // Se zerar, atualiza status automaticamente
        if (med.getQuantidade() == 0) {
            med.setStatus("Estoque");
        }

        repository.save(med);

        return ResponseEntity.ok(Map.of(
            "sucesso", true,
            "mensagem", "Venda registrada! Estoque atualizado.",
            "quantidadeAtual", med.getQuantidade()
        ));
    }

    @DeleteMapping("/deletar/{id}")
    public ResponseEntity<Map<String, Object>> deletar(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of(
                "sucesso", false,
                "mensagem", "Medicamento não encontrado."
            ));
        }

        repository.deleteById(id);

        return ResponseEntity.ok(Map.of(
            "sucesso", true,
            "mensagem", "Medicamento removido do estoque."
        ));
    }

    @GetMapping("/buscar/{nome}")
    public ResponseEntity<?> buscar(@PathVariable String nome) {
        Medicamento medicamento = repository.findByNome(nome);

        if (medicamento == null) {
            return ResponseEntity.status(404).body(Map.of(
                "sucesso", false,
                "mensagem", "Medicamento não encontrado."
            ));
        }

        return ResponseEntity.ok(medicamento);
    }
}
