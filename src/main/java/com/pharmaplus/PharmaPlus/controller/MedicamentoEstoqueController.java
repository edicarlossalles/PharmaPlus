package com.pharmaplus.PharmaPlus.controller;

import com.pharmaplus.PharmaPlus.model.Medicamento;
import com.pharmaplus.PharmaPlus.repository.MedicamentoEstoqueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/estoque")
@CrossOrigin ("*")
public class MedicamentoEstoqueController {
    @Autowired
    private MedicamentoEstoqueRepository repository;

    //aqui salva os medicamentos
    @PostMapping("/salvar")
    public Medicamento salvar(@RequestBody Medicamento medicamento){
        return repository.save(medicamento);
    }

    //aqui lista os medicamentos
    @GetMapping("/listar")
    public List<Medicamento> listar(){
        return repository.findAll();
    }

    //buscar por id
    @GetMapping("/buscar/{nome}")
    public ResponseEntity<?> buscar(@PathVariable String nome) {
        Medicamento medicamento = repository.findByNome(nome);

        if (medicamento == null) {
            return ResponseEntity.status(404).body("Medicamento não encontrado!");
        }

        return ResponseEntity.ok(medicamento);
    }

    //deletar pelo id
    @GetMapping
    public String deletar(@PathVariable Long id){
        repository.deleteById(id);
        return "Medicamento removido do estoque";
    }
}
