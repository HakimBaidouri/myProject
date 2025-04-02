package com.example.myProject.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import java.time.LocalDateTime;

public class CompanyRequestDTO {

    @NotBlank(message = "Email cannot be blank")
    private String name;

    @NotBlank(message = "Email cannot be blank")
    private String vat;

    private String phoneNumber;

    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Email should be valid")
    private String email;


    private String address;
    private String city;
    private String postalCode;

    @NotBlank(message = "Email cannot be blank")
    private String country;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;


    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }

    public String getVat() {
        return vat;
    }
    public void setVat(String vat) {
        this.vat = vat;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }
    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }
    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }
    public void setCity(String city) {
        this.city = city;
    }

    public String getPostalCode() {
        return postalCode;
    }
    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public String getCountry() {
        return country;
    }
    public void setCountry(String country) {
        this.country = country;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
