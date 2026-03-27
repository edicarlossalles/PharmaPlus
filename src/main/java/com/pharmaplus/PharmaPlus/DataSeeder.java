package com.pharmaplus.PharmaPlus;

import java.time.LocalDate;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import com.pharmaplus.PharmaPlus.model.Medicamento;
import com.pharmaplus.PharmaPlus.model.Usuario;
import com.pharmaplus.PharmaPlus.repository.MedicamentoEstoqueRepository;
import com.pharmaplus.PharmaPlus.repository.UsuarioRepository;

@Component
public class DataSeeder implements CommandLineRunner {

    private final MedicamentoEstoqueRepository medRepo;
    private final UsuarioRepository            userRepo;
    private final BCryptPasswordEncoder        encoder;

    public DataSeeder(MedicamentoEstoqueRepository medRepo,
                      UsuarioRepository userRepo,
                      BCryptPasswordEncoder encoder) {
        this.medRepo  = medRepo;
        this.userRepo = userRepo;
        this.encoder  = encoder;
    }

    @Override
    public void run(String... args) {
        seedUsuarios();
        seedMedicamentos();
    }

    private void seedUsuarios() {

        int criados = 0;

        if (userRepo.findByMatricula(12345) == null) {
            userRepo.save(usuario(12345, "Senha123", "Farmacêutico",  "Farmacêutico",  "farmaceutico@pharmaplus.com",    "FARMACEUTICO"));
            criados++;
        }
        if (userRepo.findByMatricula(2222) == null) {
            userRepo.save(usuario(2222, "farm456",  "Carlos Souza",   "Farmacêutico",  "carlos@pharmaplus.com", "FARMACEUTICO"));
            criados++;
        }
        if (userRepo.findByMatricula(3333) == null) {
            userRepo.save(usuario(3333, "atend123", "Maria Santos",   "Atendente",     "maria@pharmaplus.com",  "ATENDENTE"));
            criados++;
        }

        if (criados > 0) {
            System.out.println("✅ DataSeeder: " + criados + " usuário(s) de teste criado(s) (BCrypt).");
        } else {
            System.out.println("ℹ️  DataSeeder: usuários de teste já existem, seed ignorado.");
        }
    }

    private Usuario usuario(Integer mat, String senha, String nome, String cargo, String email, String role) {
        Usuario u = new Usuario();
        u.setMatricula(mat);
        u.setSenha(encoder.encode(senha));
        u.setNome(nome);
        u.setCargo(cargo);
        u.setEmail(email);
        u.setRole(role);
        return u;
    }

    private void seedMedicamentos() {
        if (medRepo.count() > 0) return;

        List<Medicamento> lista = List.of(
            med("Amoxicilina 500mg",          "Original",  15, "2027-03-01", "A1 - Fileira 1", "Disponível"),
            med("Amoxicilina 500mg Genérico",  "Genérico",   8, "2026-11-01", "A1 - Fileira 2", "Disponível"),
            med("Ampicilina 500mg",            "Original",   5, "2027-01-15", "A1 - Fileira 3", "Disponível"),
            med("Azitromicina 500mg",          "Original",  12, "2027-06-01", "A2 - Fileira 1", "Disponível"),
            med("Azitromicina 500mg Genérico", "Genérico",   6, "2026-09-01", "A2 - Fileira 2", "Disponível"),
            med("Buscopan Composto",           "Original",  20, "2027-08-01", "B1 - Fileira 1", "Disponível"),
            med("Butilescopolamina Genérico",  "Genérico",   9, "2026-12-01", "B1 - Fileira 2", "Disponível"),
            med("Captopril 25mg",              "Original",  18, "2027-04-01", "C1 - Fileira 1", "Disponível"),
            med("Captopril 25mg Genérico",     "Genérico",  11, "2027-02-01", "C1 - Fileira 2", "Disponível"),
            med("Cetoconazol 200mg",           "Original",   7, "2026-10-01", "C2 - Fileira 1", "Disponível"),
            med("Ciprofloxacino 500mg",        "Original",  14, "2027-05-01", "C2 - Fileira 2", "Disponível"),
            med("Ciprofloxacino Genérico",     "Genérico",   4, "2026-08-01", "C2 - Fileira 3", "Disponível"),
            med("Clonazepam 2mg",              "Original",   3, "2027-07-01", "C3 - Fileira 1", "Disponível"),
            med("Cloreto de Sódio 0,9%",       "Genérico",  30, "2026-06-01", "C3 - Fileira 2", "Disponível"),
            med("Dexametasona 4mg",            "Original",  10, "2027-09-01", "D1 - Fileira 1", "Disponível"),
            med("Diazepam 10mg",               "Original",   5, "2027-01-01", "D1 - Fileira 2", "Disponível"),
            med("Dipirona 500mg",              "Original",  25, "2027-10-01", "D2 - Fileira 1", "Disponível"),
            med("Dipirona 500mg Genérico",     "Genérico",  20, "2027-03-15", "D2 - Fileira 2", "Disponível"),
            med("Doxiciclina 100mg",           "Original",   8, "2026-11-15", "D3 - Fileira 1", "Disponível"),
            med("Enalapril 10mg",              "Original",  16, "2027-04-15", "E1 - Fileira 1", "Disponível"),
            med("Enalapril 10mg Genérico",     "Genérico",  12, "2027-02-15", "E1 - Fileira 2", "Disponível"),
            med("Esomeprazol 40mg",            "Original",  13, "2027-06-15", "E2 - Fileira 1", "Disponível"),
            med("Fluconazol 150mg",            "Original",   9, "2027-08-15", "F1 - Fileira 1", "Disponível"),
            med("Fluconazol Genérico",         "Genérico",   5, "2026-07-01", "F1 - Fileira 2", "Disponível"),
            med("Furosemida 40mg",             "Original",  11, "2027-05-15", "F2 - Fileira 1", "Disponível"),
            med("Furosemida Genérico",         "Genérico",   7, "2027-01-20", "F2 - Fileira 2", "Disponível"),
            med("Ibuprofeno 600mg",            "Original",  22, "2027-11-01", "I1 - Fileira 1", "Disponível"),
            med("Ibuprofeno 600mg Genérico",   "Genérico",  17, "2027-04-20", "I1 - Fileira 2", "Disponível"),
            med("Ivermectina 6mg",             "Original",  10, "2027-09-15", "I2 - Fileira 1", "Disponível"),
            med("Losartana 50mg",              "Original",  19, "2027-07-15", "L1 - Fileira 1", "Disponível"),
            med("Losartana 50mg Genérico",     "Genérico",  14, "2027-03-20", "L1 - Fileira 2", "Disponível"),
            med("Loratadina 10mg",             "Original",  16, "2027-10-15", "L2 - Fileira 1", "Disponível"),
            med("Loratadina Genérico",         "Genérico",  11, "2027-05-20", "L2 - Fileira 2", "Disponível"),
            med("Metformina 850mg",            "Original",  20, "2027-08-20", "M1 - Fileira 1", "Disponível"),
            med("Metformina Genérico",         "Genérico",  15, "2027-06-20", "M1 - Fileira 2", "Disponível"),
            med("Metronidazol 400mg",          "Original",   8, "2026-12-15", "M2 - Fileira 1", "Disponível"),
            med("Metronidazol Genérico",       "Genérico",   2, "2027-04-01", "M2 - Fileira 2", "Disponível"),
            med("Nimesulida 100mg",            "Original",  18, "2027-11-15", "N1 - Fileira 1", "Disponível"),
            med("Nimesulida Genérico",         "Genérico",  13, "2027-07-20", "N1 - Fileira 2", "Disponível"),
            med("Nifedipina 10mg",             "Original",   7, "2027-02-20", "N2 - Fileira 1", "Disponível"),
            med("Omeprazol 20mg",              "Original",  24, "2027-12-01", "O1 - Fileira 1", "Disponível"),
            med("Omeprazol 20mg Genérico",     "Genérico",  19, "2027-08-25", "O1 - Fileira 2", "Disponível"),
            med("Paracetamol 750mg",           "Original",  28, "2027-10-20", "P1 - Fileira 1", "Disponível"),
            med("Paracetamol Genérico",        "Genérico",  22, "2027-06-25", "P1 - Fileira 2", "Disponível"),
            med("Prednisona 20mg",             "Original",  10, "2027-09-20", "P2 - Fileira 1", "Disponível"),
            med("Propranolol 40mg",            "Original",  13, "2027-04-25", "P3 - Fileira 1", "Disponível"),
            med("Propranolol Genérico",        "Genérico",   9, "2027-01-25", "P3 - Fileira 2", "Disponível"),
            med("Ranitidina 150mg",            "Original",  11, "2027-11-20", "R1 - Fileira 1", "Disponível"),
            med("Ranitidina Genérico",         "Genérico",   3, "2027-05-01", "R1 - Fileira 2", "Disponível"),
            med("Simeticona 40mg",             "Original",  16, "2027-12-15", "S1 - Fileira 1", "Disponível"),
            med("Sinvastatina 20mg",           "Original",  21, "2027-10-25", "S2 - Fileira 1", "Disponível"),
            med("Sinvastatina Genérico",       "Genérico",  16, "2027-08-30", "S2 - Fileira 2", "Disponível"),
            med("Tramadol 50mg",               "Original",   6, "2027-03-25", "T1 - Fileira 1", "Disponível"),
            med("Trimetoprim + Sulfa",         "Original",   9, "2027-05-25", "T2 - Fileira 1", "Disponível"),
            med("Varfarina 5mg",               "Original",   4, "2027-02-25", "V1 - Fileira 1", "Disponível"),
            med("Vitamina D 1000UI",           "Original",  25, "2028-01-01", "V2 - Fileira 1", "Disponível"),
            med("Vitamina C 500mg",            "Original",  30, "2028-02-01", "V2 - Fileira 2", "Disponível")
        );
        medRepo.saveAll(lista);
        System.out.println("✅ DataSeeder: " + lista.size() + " medicamentos cadastrados.");
    }

    private Medicamento med(String nome, String cat, int qtd, String val, String prat, String status) {
        Medicamento m = new Medicamento();
        m.setNome(nome); m.setCategoria(cat); m.setQuantidade(qtd);
        m.setValidade(LocalDate.parse(val)); m.setPrateleira(prat); m.setStatus(status);
        return m;
    }
}
