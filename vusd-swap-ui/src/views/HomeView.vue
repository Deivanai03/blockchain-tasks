<template>
    <div class="container">
      <h1>VUSD Swap Dashboard</h1>
      <p><strong>Vow Pool:</strong> {{ contractInfo.vowPool }}</p>
      <p><strong>Swap Rate:</strong> {{ contractInfo.swapRate }}</p>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  import { ref, onMounted } from "vue";
  
  export default {
    setup() {
      const contractInfo = ref({ vowPool: "Loading...", swapRate: "Loading..." });
  
      const fetchContractInfo = async () => {
        try {
          const response = await axios.get("http://localhost:3002/contract-info");
          contractInfo.value = response.data;
        } catch (error) {
          console.error("Error fetching contract info:", error);
        }
      };
  
      onMounted(fetchContractInfo);
  
      return { contractInfo };
    },
  };
  </script>
  
  <style scoped>
  .container {
    text-align: center;
    padding: 20px;
    font-family: Arial, sans-serif;
  }
  </style>
  