import Joi from "joi"
const validateNotesSchema = Joi.object({
    title: Joi.string().required().min(1).max(30).messages({ "string.empty": "Please enter title", "string.min": "Please enter min 2 letters", "string.max": "Please enter below 30 letters" }),
    content: Joi.string().required().min(1).max(100).messages({ "string.empty": "Please enter title", "string.min": "Please enter min 2 letters", "string.max": "Please enter below 30 letters" }),
    check: Joi.check().default("false")
}).options({ stripUnknown: true });
const validateTenantsSchema = Joi.object({
    name: Joi.string().min(1).max(30).required().messages({ "string.empty": "Please enter", "string.min": "Please enter min 1 char", "string.max": "Please enter below 30 char" }),
    plan: Joi.string().valid("free", "paid", "enterprise").default("free"),
    noteLimit: Joi.string().valid("3", "unlimited").default("3"),
    paidUsers: Joi.number.default(0)
}).options({ stripUnknown: true })
const validateUsersSchema = Joi.object({
    username: Joi.string().min(5).max(30).required().messages({ "string.empty": "Please enter email", "string.min": "Please enter min 5 char", "string.max": "Please enter below 30 char" }),
    email: Joi.string().email({ tlds: { allow: false } }).messages({ "string.empty": "Please enter email", "string.min": "Please enter min 5 char", "string.max": "Please enter below 30 char" }),
    password: Joi.string.pattern(new RegExp()).messages({ "string.empty": "Please enter password", "string.min": "Please enter min 5 char", "string.max": "Please enter below 30 char" }),
    role: Joi.string().valid("user", "admin").default("user"),
}).options({ stripUnknown: true })
export { validateNotesSchema, validateTenantsSchema, validateUsersSchema }