<template>
    <div class="container">
      <h1>Node Info</h1>
      <form @submit.prevent="fetchNodeInfo">
        <input v-model="walletAddress" type="text" id="address" placeholder="Enter address">
        <button type="submit">Fetch Info</button>
      </form>
  
      <div v-if="nodeInfo">
        <h2>Node Details</h2>
        <p><strong>Deposits:</strong> {{ nodeInfo.deposits }}</p>
        <p><strong>Withdrawals:</strong> {{ nodeInfo.withdrawals }}</p>
      </div>
  
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  import { ref } from "vue";
  
  export default {
    setup() {
      const walletAddress = ref("");
      const nodeInfo = ref(null);
      const error = ref("");
  
      const fetchNodeInfo = async () => {
        if (!walletAddress.value) {
          error.value = "Please enter address!";
          return;
        }
  
        try {
          const response = await axios.get(`http://localhost:3002/node-info/${walletAddress.value}`);
          nodeInfo.value = response.data;
          error.value = ""; // Clear error message
        } catch (err) {
          console.error("Error fetching node info:", err);
          error.value = "Failed to fetch node info. Please check the address.";
          nodeInfo.value = null;
        }
      };
  
      return { walletAddress, nodeInfo, fetchNodeInfo, error };
    },
  };
  </script>
  
  <style scoped>
  .container {
    text-align: center;
    padding: 20px;
  }
  
  form {
    margin-bottom: 20px;
  }
  
  input {
    padding: 8px;
    margin-right: 10px;
    width: 300px;
    border: 1px solid #ccc;
  }
  
  button {
    padding: 8px 12px;
    background-color: #41a39b;
    color: white;
    border: none;
    cursor: pointer;
  }
  
  button:hover {
    background-color: #0e6860;
  }
  
  .error {
    color: red;
    margin-top: 10px;
  }
  </style>
  