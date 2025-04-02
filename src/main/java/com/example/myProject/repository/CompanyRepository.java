package com.example.myProject.repository;

import com.example.myProject.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyRepository extends JpaRepository<Company, Long>{

}
