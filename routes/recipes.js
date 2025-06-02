var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");


/**
 * This path returns a list of random recipes (V)
 */
router.get("/random", async (req, res, next) => {
  try {
    const recipes = await recipes_utils.getRandomRecipes();
    
    if (!recipes || recipes.length <= 0){
      console.log("No random recipes found")
      next(error);
    }

    res.status(200).send(recipes);
    } catch (error) {
    console.log("Error in getRandomRecipes: ", error);
    next(error); // don't throw, call next for error handler
}
});

// Last user query search V
router.get("/lastSearch", async (req, res, next) => {
  try{
  const result = req.session.lastSearch.length == 0 ? 
                                                    "":req.session.lastSearch;
  res.status(200).send({success: true, query: result});
  return;
  } catch(err) {
    next(err);
  }
});

// Get family recipes for the logged-in user  (V)
router.get('/familyRecipes', async (req, res, next) => {
  try {
    const userId = req.user_id;

    // early exit
    if (!userId) {
      console.log("No user_id found in request.");
      return res.status(400).json({ success: false, message: "Missing user_id in request." });
    }

    const recipes = await recipes_utils.getAllFamilyRecipes(userId);

    // recipes checks
    if (!recipes || recipes.length === 0) {
      console.log("No family recipes found for user:", userId);
      return res.status(404).json({ success: false, message: "No family recipes found." });
    }

    // success
    console.log("Found", recipes.length, "family recipes for user:", userId);
    res.status(200).json({ success: true, familyRecipes: recipes });
  } catch (err) {
    next(err);
  }
});


// Search Recipes V
router.get("/search", async (req, res, next) => {
  // log
  console.log("search query: ", req.query.query);

  // Set cookie for last search
  req.session.lastSearch = req.query.query;
  console.log("session user_id login: " + req.session.user_id);

  try {
    // get query params
    const query = req.query.query || "";
    const cuisine = req.query.cuisine || undefined;
    const diet = req.query.diet || undefined;
    const intolerances = req.query.intolerances || undefined;
    const number =  Number(req.query.number) || 5;

    // Invalid input guard
    if (number > 15 || number < 5){
      let invalidMsg = "Input is not valid";
      console.log(message);
      res.status(404).send({ success: false, invalidMsg });
      return;
    }

    // perform the api call
    const recipes = await recipes_utils.searchRecipe(
      query,
      cuisine,
      diet,
      intolerances,
      number
    );


    // No recipes found
    if (recipes.data.results.length == 0) {
      let message = "No recipes found";
      console.log(message);
      res.status(204).send({message: message});
      return;
    }

    // success
    console.log("success searching recipes");
    res.status(200).json(recipes.data.results);
  } catch (error) {
    console.log("Error in searchRecipe: ", error);
    next(error); 
  }
});


/**
 * returns a full details of a recipe by its id(V)
 */
router.get("/:recipeId", async (req, res, next) => {
  try {
    const recipeId = req.params.recipeId && req.params.recipeId.trim();
    if (!recipeId || isNaN(recipeId)) {
      console.log("Invalid recipeId:", recipeId);
      return res.status(400).json({
        success: false,
        message: "Invalid recipe ID provided."
      });
    }

    console.log(`Fetching full info for recipe: ${recipeId}`);

    const recipe = await recipes_utils.getRecipeDetails(recipeId);

    if (!recipe) {
      console.log(`Recipe not found: ${recipeId}`);
      return res.status(404).json({
        success: false,
        message: "Recipe not found."
      });
    }

    res.status(200).json({
      success: true,
      data: recipe
    });
  } catch (error) {
    next(error);
  }
});


//  Create a recipe (V)
router.put("/", async (req, res, next) => {
  try {
    const username = req.session.username; 
    const { 
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
    } = req.body;

    // Validation 
    if (!username || !title || !image_url || ready_in_minutes == null || 
        aggregate_likes == null || servings == null || !summary || 
        !ingredients || !instructions) {
      return res.status(400).send({ 
        message: "The provided information is not valid.", 
        success: false 
      });
    }

    await recipes_utils.saveRecipeToDb({
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
    });

    res.status(201).send({ message: "Recipe created successfully", success: true });
  } catch (error) {
    next(error);
  }
});


module.exports = router;
