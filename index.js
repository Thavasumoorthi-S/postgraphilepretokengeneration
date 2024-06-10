"use strict";

exports.handler = async (event, context, callback) => {
    try {
        console.log("Event: ", event);

        // Extract user attributes from the event
        const { sub: cognitoId } = event.request.userAttributes;

        // Define the GraphQL query
        const graphqlQuery = `
            query MyQuery($cognitoid: String!) {
                userByCognitoid(cognitoid: $cognitoid) {
                    id
                    name
                }
            }
        `;

        // Define the GraphQL variables
        const graphqlVariables = {
            cognitoid: cognitoId
        };

        // Make a request to your GraphQL API using fetch
        const graphqlUrl = "https://fast-summary-snake.ngrok-free.app/graphql"; // Change to your GraphQL API URL
        const graphqlResponse = await fetch(graphqlUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({
                query: graphqlQuery,
                variables: graphqlVariables
            })
        });

        // Parse the JSON response
        const responseData = await graphqlResponse.json();

        // Check if the user is found
        const userData = responseData.data.userByCognitoid;
        if (!userData) {
            console.log("User not found");
            return callback("User not found", event);
        }

        // Extract user data
        const { id: userId, name } = userData;
        const { groupsToOverride: roles } = event.request.groupConfiguration;

        // Construct the claims to add or override
        const claimsToAddOrOverride = {
            "https://myapp.com/jwt/claims": JSON.stringify({
                "user_id": userId,
                "role": roles[roles.length - 1],
                "name": name
            })
        };

        // Override the claims in the token
        event.response = {
            claimsOverrideDetails: {
                claimsToAddOrOverride
            }
        };

        console.log("Event after adding claims: ", event);
        callback(null, event);
    } catch (error) {
        console.error("Error in handler:", error);
        callback("Error adding claims", event);
    }
};
