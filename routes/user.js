var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.username) {
    DButils.execQuery("SELECT username FROM users").then((users) => {
      if (users.find((x) => x.username === req.session.username)) {
        req.username = req.session.username;
        next();
      }
    }).catch(err => next(err));
  } else {
    res.sendStatus(401);
  }
});


/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user (V)
 */
router.post('/favorites', async (req,res,next) => {
  try{
    const username = req.session.username;
    const recipe_id = req.body.recipeId;
    if (!username || !recipe_id) {
      res.status(404).send("Input is not valid");
    }

    await user_utils.addLikedRecipe(username,recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
    } catch(error){
    next(error);
  }
})

/**
 * This path returns the favorites recipes that were saved by the logged-in user (V)
 */
router.get('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.username;
    const recipeIdList = await user_utils.getFavoriteRecipes(user_id);
    const favRecipes = await getRecipeDetailsByIds(recipeIdList);

    res.status(200).send(favRecipes);
  } catch(error){
    next(error); 
  }
});

// Get watched recipes for the logged-in user (V)
router.get('/watchedRecipes', async (req, res, next) => {
  try {
    const userId = req.session.username; 
    const watchedIds = await user_utils.getAllWatchedRecipes(userId);
    const recipes = await recipe_utils.getRecipeDetailsByIds(watchedIds);
    res.status(200).json({ watchedRecipes: recipes });
  } catch (err) {
    next(err);
  }
});

// Get watched recipes for the logged-in user (V)
router.post('/watchedRecipes', async (req, res, next) => {
  try {
    const userId = req.session.username;
    const recipeId = req.body.recipeId;
    const recipes = await user_utils.addWatchedRecipe(userId, recipeId);
    res.status(200).json({ watchedRecipes: recipes });
  } catch (err) {
    next(err);
  }
});


// Get watched recipes for the logged-in user (V)
router.get('/myRecipes', async (req, res, next) => {
  try {
    const userId = req.session.username;
    if(!userId){
      res.status(404).json(
        {
         result: "failure",
          message: "Something's wrong, contact our support: Tnu100Bihiat@POST.BGU"
        });
    }
    const recipes = await user_utils.getMyRecipes(userId);

    res.status(200).json({ watchedRecipes: recipes, result: "success" });
  } catch (err) {
    next(err);
  }
});







module.exports = router;
