/** Contains all callback functions that use callback.
 * @module utils/common
 */
import { error as _error } from "../utils/logger";
import { PaginateResult } from "mongoose";
/**
 * Function that paginates an array, and returns it as an object
 * that is identical to what mongoose-paginate-v2 library returns.
 * @param page The page we want
 * @param limit The max number of items in a page
 * @param arrayToPaginate The array we want to paginate
 */
export const buildPaginatedObjectFromArray = (
  page: number,
  limit: number,
  arrayToPaginate: Array<any>
): PaginateResult<any> => {
  let paginationObject: PaginateResult<any> = {
    docs: arrayToPaginate.slice((page - 1) * limit, page * limit), // Using Array.slice() to paginate feelings.
    totalDocs: arrayToPaginate.length,
    limit: limit,
    totalPages: Math.ceil(arrayToPaginate.length / limit),
    page: page,
    pagingCounter: (page - 1) * limit + 1,
    hasPrevPage: true,
    hasNextPage: true,
    prevPage: page - 1,
    nextPage: page + 1,
    offset: 1,
  };
  if (page + 1 > paginationObject.totalPages) {
    paginationObject.hasNextPage = false;
    paginationObject.nextPage = null;
  }
  if (page - 1 < 1 || page > paginationObject.totalPages + 1) {
    paginationObject.hasPrevPage = false;
    paginationObject.prevPage = null;
  }
  return paginationObject;
};

export const removeEmptyProperties = (obj: any): object =>
  Object.keys(obj)
    .filter((k) => obj[k] != null)
    .reduce((a, k) => ({ ...a, [k]: obj[k] }), {});
