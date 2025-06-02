const DButils = require("./DButils");

async function getFavoriteRecipes(user_id){
    const recipes = await DButils.execQuery(`SELECT * from FavoriteRecipes WHERE username='${user_id}'`);
    return recipes;
}

// --- Add Like To Recipes --- //
async function addLikedRecipe(username, recipeId) {
    // Check if already liked
    const existing = await DButils.execQuery(
        `SELECT * FROM FavoriteRecipes WHERE username = ? AND recipeId = ?`,
        [username, recipeId]
    );

    if (existing.length === 0) {
        await DButils.execQuery(
            `INSERT INTO FavoriteRecipes (username, recipeId) VALUES (?, ?)`,
            [username, recipeId]
        );
    }
    
}

// --- Add New Watched Recipe --- //
async function addWatchedRecipe(username, recipeId) {
    // check if user has the recipe in their watched list
    const existing = await DButils.execQuery(
        `SELECT * FROM WatchedRecipes WHERE username = ? AND recipeId = ?`,
        [username, recipeId]
    );

    const now = new Date();
    if (existing.length > 0) {
        // Already exists, just update watchedAt timestamp
        await DButils.execQuery(
            `UPDATE WatchedRecipes SET watchedAt = ? WHERE username = ? AND recipeId = ?`,
            [now, username, recipeId]
        );
        return;
    }

    // Get count of recipes this user has watched
    const watchedList = await DButils.execQuery(
        `SELECT * FROM WatchedRecipes WHERE username = ? ORDER BY watchedAt ASC`,
        [username]
    );
    if (watchedList.length >= 3) {
        // Remove the oldest (the one with smallest watchedAt)
        const oldest = watchedList[0];
        await DButils.execQuery(
            `DELETE FROM WatchedRecipes WHERE username = ? AND recipeId = ?`,
            [username, oldest.recipeId]
        );
    }
    // Insert the new watched recipe
    await DButils.execQuery(
        `INSERT INTO WatchedRecipes (username, recipeId, watchedAt) VALUES (?, ?, ?)`,
        [username, recipeId, now]
    );
}


// --- Get all watched recipes --- // (From DB)
async function getAllWatchedRecipes(userId){
    const recipes = await DButils.execQuery(`
        SELECT * FROM WatchedRecipes WHERE username = '${userId}'
    `);
    return recipes;
}

async function getMyRecipes(userId){
    const recipes = await DButils.execQuery(
        "SELECT * FROM recipes WHERE username = ? AND created_by = ?",
        [userId, 'USER']
    );
    return recipes;
}



// Savein DB:
// Recipes - family(id: 000xxx),recipeCreation(ID/SpooncularID, likesCount for recipe,createdBy ))
// User
// FavoriteRecipes [username, [id1, ..., idn]]
// WatchedRecipes [username,[id1,id2,id3]]

// Meals
module.exports = {
    addLikedRecipe,
    addWatchedRecipe,
    getAllWatchedRecipes,
    getFavoriteRecipes,
    getMyRecipes
};

