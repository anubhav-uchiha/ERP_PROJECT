// module.exports = ["USER_CREATE", "USER_READ", "USER_UPDATE", "USER_DELETE"];

// Export an array of allowed permission actions.
// These values will typically be used as an ENUM in Mongoose schemas
// to restrict permission actions to only these four CRUD operations.

module.exports = ["CREATE", "READ", "UPDATE", "DELETE"];
// CREATE  -> Permission to create new records/resources
// READ    -> Permission to view or retrieve existing records/resources
// UPDATE  -> Permission to modify existing records/resources
// DELETE  -> Permission to remove records/resources
