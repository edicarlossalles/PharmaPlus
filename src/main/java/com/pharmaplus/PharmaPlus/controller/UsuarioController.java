package com.pharmaplus.PharmaPlus.controller;

import com.pharmaplus.PharmaPlus.model.Usuario;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pharmaplus.PharmaPlus.repository.UsuarioRepository;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/usuarios")
public class UsuarioController {
    private final UsuarioRepository usuarioRepository;

    public UsuarioController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @PostMapping("/registro")
    public void salvarUsuario(@RequestBody Usuario usuario){
        var findUsuario = this.usuarioRepository.findByMatricula(usuario.getMatricula());
        if(findUsuario != null){
            System.out.println("Usuario já existente!");
            return;
        }
        var novoUsuario = this.usuarioRepository.save(usuario);
        System.out.println("Usuario Criado com sucesso!");
    }
}
