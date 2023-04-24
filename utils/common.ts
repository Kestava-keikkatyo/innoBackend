/** Contains all callback functions that use callback.
 * @module utils/common
 */
import { PaginateResult } from "mongoose";
import User from "../models/User";
import { INotification, IUserDocument } from "../objecttypes/modelTypes";
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

export const removeEmptyProperties = (obj: object): object =>
  Object.keys(obj)
    .filter((k) => obj[k as keyof object] != null)
    .reduce((a, k) => ({ ...a, [k]: obj[k as keyof object] }), {});

export const copyProperties = (obj: object, properties: string[]): object => {
  const result = {};
  for (let property of properties) {
    result[property as keyof object] = obj[property as keyof object];
  }
  return result;
};

export const addUserNotification = async (notification: INotification, recipientId: string) => {
  const doc: IUserDocument | null = await User.findByIdAndUpdate(recipientId, {
    $push: {
      notifications: notification,
    },
  });
  return doc;
};

