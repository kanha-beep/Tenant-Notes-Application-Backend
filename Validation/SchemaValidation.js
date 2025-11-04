import Joi from "joi";

// Validation for creating/updating a note
export const noteValidation = Joi.object({
  title: Joi.string().min(1).max(200).required(),       // title is required
  content: Joi.string().min(1).required(),              // content is required
  check: Joi.boolean(),                                 // optional, defaults false
  user: Joi.string().hex().length(24).required(),       // Mongo ObjectId for user
  tenant: Joi.string().hex().length(24).required()      // Mongo ObjectId for tenant
}).options({
  abortEarly: false,   // validate all errors, not just first
  allowUnknown: true   // allow extra fields in req.body
});
export const tenantValidation = Joi.object({
  name: Joi.string().min(1).max(100).required(),               // tenant name
  plan: Joi.string().valid("free", "paid", "enterprise"),      // must be one of the enum values
  noteLimit: Joi.string().optional(),                           // optional field
  paidUsers: Joi.number().integer().min(0).optional()           // optional, defaults 0
}).options({
  abortEarly: false,   // validate all errors, not just first
  allowUnknown: true   // allow extra fields in req.body
});
// export const userValidation = Joi.object({
//   username: Joi.string().min(1).max(50).required(),
//   email: Joi.string().email({ tlds: false }).required(),
//   password: Joi.string().min(6).max(1024).required(),
//   role: Joi.string().valid("user", "admin").optional(),
//   tenant: Joi.string().min(1).max(50).required()
// }).options({
//   abortEarly: false,   // validate all errors, not just first
//   allowUnknown: true   // allow extra fields in req.body
// });
export const userValidation = Joi.object({
  email: Joi.string().email({ tlds: false }).required(),
  password: Joi.string().min(6).max(1024).required(),
  tenant: Joi.string().min(1).max(50).required(),
  // username: Joi.string().min(1).max(50)
  //   .when('$isLogin', { is: true, then: Joi.forbidden(), otherwise: Joi.required() }),
  // role: Joi.string().valid("user", "admin")
  //   .when('$isLogin', { is: true, then: Joi.forbidden(), otherwise: Joi.optional() }),
}).options({
  abortEarly: false,
  allowUnknown: true
});

