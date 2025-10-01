import resolve from "@rollup/plugin-node-resolve";

export default {
  input: "src/bar-sensor-card.js",   
  output: {
    file: "dist/bar-sensor-card.js", 
    format: "es",                    
  },
  plugins: [
    resolve(),  
  ],
};