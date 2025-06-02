require("dotenv").config();
const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("./DButils");
const apiKey = process.env.SPOONACULAR_API_KEY;

/* 
id
title
image
readyInMinutes
vegetarian
vegan
glutenFree
aggregateLikes
servings
intolerances
cuisines
diets
instructions
extendedIngredients{ingredient.name, amount,unit }
----
indication if user watched it
indication if user favorited it
*/





/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */
async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: apiKey,
        }
    });
}

// Search for recipes through spooncular API 
async function searchRecipe(
    query = '',
    cuisineParam = undefined,
    dietParam = undefined,
    intolerancesParam = undefined,
    number = 5){
        return await axios.get(`${api_domain}/complexSearch`, {
            params: {
            query: query || '', 
            diet: dietParam || undefined,
            intolerances: intolerancesParam || undefined,
            cuisine: cuisineParam || undefined,
            number: number,
            apiKey: apiKey,
            },
        }
    );
}

async function getRecipeDetailsByIds(idList) {
  // idList is an array of numbers or strings
  const recipes = [];

  for (let recipeObj of idList) {
    let recipeId = ("" + recipeObj.recipeId).trim();

    // 1. Try to get DB first
    let dbRecipe = await getRecipeFromDB(recipeId); 

    if (dbRecipe) {
      recipes.push(dbRecipe);
    } else {
      // 2. Fallback to Spoonacular
      let recipe_info = await getRecipeInformation(recipeId);
      if (recipe_info && recipe_info.data) {
        recipes.push(recipe_info.data);
      } else {
        // Optional: Push null or custom error object if not found anywhere
        recipes.push({ error: "Not found", recipeId });
      }
    }
  }
  return recipes;
}

/// --- get recipe from Database (return null if none found) --- ///
async function getRecipeFromDB(recipeId) {
  const result = await DButils.execQuery("SELECT * FROM recipes WHERE recipe_id = ?", [recipeId]);
  if (result && result.length > 0) {
    return result[0]; // or format to your output model
  }
  return null;
}

/// --- Get all recipe details from API --- ///
async function getRecipeDetails(recipe_id) {
    recipe_id = recipe_id.trim();
    let recipe_info = await getRecipeInformation(recipe_id);
    return recipe_info.data;
}

// --- Random Recipes --- //
async function getRandomRecipes() {
    let response = await axios.get(`${api_domain}/random`, {
        params: {
            number: 3,
            apiKey: apiKey,
        }
    });
    // send content data(ONLY), of the response
    return response.data.recipes;
}

// --- Family Recipes --- // (From DB) 
async function getAllFamilyRecipes(){
    const familyRecipes = await DButils.execQuery(
        `SELECT * FROM recipes WHERE created_by = "FAMILY"`
    );
    return familyRecipes;
}

// Save recipe into MySQL Database.
async function saveRecipeToDb({
  username,
  title,
  image_url,
  ready_in_minutes,
  aggregate_likes,
  vegetarian,
  vegan,
  gluten_free,
  summary,
  ingredients,
  instructions,
  servings,
  createdBy
}) {

    console.log("Saving recipe:", {
  title, image_url, ready_in_minutes, aggregate_likes, vegetarian,
  vegan, gluten_free, summary, ingredients, instructions, servings, createdBy
});
  // Save as a new row in your recipes table.
  // Assumes you have a recipes table with these fields.
  await DButils.execQuery(
    `INSERT INTO recipes (
      username, title, image_url, ready_in_minutes, aggregate_likes, vegetarian, vegan, gluten_free, summary, ingredients, instructions, servings, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      username,
      title,
      image_url,
      ready_in_minutes,
      aggregate_likes,
      vegetarian,
      vegan,
      gluten_free,
      summary,
      JSON.stringify(ingredients),
      JSON.stringify(instructions),
      servings,
      createdBy
    ]
  );
}



  module.exports = {
    getRecipeInformation,
    searchRecipe,
    getRandomRecipes,
    getRecipeDetailsByIds,
    getAllFamilyRecipes,
    getRecipeDetails,
    saveRecipeToDb
  };

