package com.example.myProject.controller;

import com.example.myProject.dto.UserRequestDTO;
import com.example.myProject.model.Company;
import com.example.myProject.model.User;
import com.example.myProject.repository.CompanyRepository;
import com.example.myProject.dto.CompanyRequestDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import jakarta.validation.Valid;
import java.time.LocalDateTime;

@RestController
@RequestMapping("myProject/api/companies")
public class CompanyController {
    private final CompanyRepository companyRepository;

    public CompanyController(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    @GetMapping
    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Company> createCompany(@Valid @RequestBody CompanyRequestDTO companyRequestDTO) {

        Company company = new Company();
        company.setName(companyRequestDTO.getName());
        company.setVat(companyRequestDTO.getVat());
        company.setPhoneNumber(companyRequestDTO.getPhoneNumber());
        company.setEmail(companyRequestDTO.getEmail());
        company.setAddress(companyRequestDTO.getAddress());
        company.setCity(companyRequestDTO.getCity());
        company.setPostalCode(companyRequestDTO.getPostalCode());
        company.setCountry(companyRequestDTO.getCountry());

        Company savedCompany = companyRepository.save(company);

        return new ResponseEntity<>(savedCompany, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Company> updateCompany(@PathVariable Long id, @Valid @RequestBody CompanyRequestDTO companyRequestDTO) {
        Company existingCompany = companyRepository.findById(id).orElse(null);

        if (existingCompany == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        existingCompany.setName(companyRequestDTO.getName());
        existingCompany.setVat(companyRequestDTO.getVat());
        existingCompany.setPhoneNumber(companyRequestDTO.getPhoneNumber());
        existingCompany.setEmail(companyRequestDTO.getEmail());
        existingCompany.setAddress(companyRequestDTO.getAddress());
        existingCompany.setCity(companyRequestDTO.getCity());
        existingCompany.setPostalCode(companyRequestDTO.getPostalCode());
        existingCompany.setCountry(companyRequestDTO.getCountry());
        existingCompany.setUpdatedAt(LocalDateTime.now());

        Company updatedCompany = companyRepository.save(existingCompany);

        return new ResponseEntity<>(updatedCompany, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Company> deleteCompany(@PathVariable Long id){
        Company existingCompany = companyRepository.findById(id).orElse(null);

        if (existingCompany == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        companyRepository.delete(existingCompany);

        return new ResponseEntity<>(existingCompany, HttpStatus.OK);
    }
}
