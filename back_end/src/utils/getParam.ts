import { Request, Response } from "express";

/**
 * Safely extracts a route parameter from req.params.
 * Throws a 400 error or returns a 400 response if the parameter is invalid.
 *
 * @param req - The Express request object.
 * @param name - The name of the parameter to extract.
 * @returns The parameter value as a string.
 */
export function getParam(req: Request, name: string): string {
  const value = req.params[name];

  if (Array.isArray(value)) {
    throw new Error(`Invalid parameter: ${name} should not be an array.`);
  }

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Invalid parameter: ${name} is required and must be a non-empty string.`);
  }

  return value;
}