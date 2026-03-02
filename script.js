"use strict";

const inputEl = document.getElementById("country-input");
const searchBtn = document.getElementById("search-btn");
const spinner = document.getElementById("loading-spinner");
const countryInfo = document.getElementById("country-info");
const bordersSection = document.getElementById("bordering-countries");
const errorMsg = document.getElementById("error-message");

function showSpinner() {
  spinner.classList.remove("hidden");
}

function hideSpinner() {
  spinner.classList.add("hidden");
}

function setError(message) {
  errorMsg.textContent = message;
}

function clearError() {
  errorMsg.textContent = "";
}

function clearResults() {
  countryInfo.innerHTML = "";
  bordersSection.innerHTML = "";
}

async function fetchCountryByName(countryName) {
  const response = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}`);
  if (!response.ok) {
    throw new Error("Country not found. Please try another name.");
  }
  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Country not found. Please try another name.");
  }
  return data[0];
}

async function fetchBorderByCode(code) {
  const response = await fetch(`https://restcountries.com/v3.1/alpha/${encodeURIComponent(code)}`);
  if (!response.ok) {
    throw new Error("Could not fetch bordering countries.");
  }
  const data = await response.json();
  return data;
}

function renderCountry(country) {
  const name = country?.name?.common ?? "Unknown";
  const capital = Array.isArray(country?.capital) ? country.capital[0] : "N/A";
  const population =
    (typeof country?.population === "number")
      ? country.population.toLocaleString()
      : "N/A";
  const region = country?.region ?? "N/A";
  const flag = country?.flags?.svg || country?.flags?.png || "";

  countryInfo.innerHTML = `
    <h2>${name}</h2>
    <p><strong>Capital:</strong> ${capital}</p>
    <p><strong>Population:</strong> ${population}</p>
    <p><strong>Region:</strong> ${region}</p>
    ${flag ? `<img src="${flag}" alt="${name} flag">` : ""}
  `;
}

function renderNoBorders() {
  bordersSection.innerHTML = "<p>This country has no bordering countries.</p>";
}

function renderBorders(borders) {
  bordersSection.innerHTML = "";

  for (const b of borders) {
    const div = document.createElement("div");
    div.className = "border-item";

    const img = document.createElement("img");
    img.src = b?.flags?.svg || b?.flags?.png || "";
    img.alt = (b?.name?.common ?? "Border country") + " flag";

    const span = document.createElement("span");
    span.textContent = b?.name?.common ?? "Unknown";

    div.appendChild(img);
    div.appendChild(span);
    bordersSection.appendChild(div);
  }
}

async function searchCountry(countryName) {
  try {
    clearError();
    clearResults();

    const trimmed = countryName.trim();
    if (trimmed.length === 0) {
      setError("Please enter a country name.");
      return;
    }

    showSpinner();

    const country = await fetchCountryByName(trimmed);
    renderCountry(country);

    const borderCodes = country?.borders;

    if (!Array.isArray(borderCodes) || borderCodes.length === 0) {
      renderNoBorders();
      return;
    }

    const borderPromises = borderCodes.map(code => fetchBorderByCode(code));
    const borders = await Promise.all(borderPromises);
    renderBorders(borders);

  } catch (error) {
    setError(error.message || "Something went wrong. Please try again.");
  } finally {
    hideSpinner();
  }
}

searchBtn.addEventListener("click", () => {
  searchCountry(inputEl.value);
});

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    searchCountry(inputEl.value);
  }
});