import mongoose, { Schema } from 'mongoose';
import { IFileDocument } from '../objecttypes/modelTypes';

const FileSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  creator: { type: String, required: true },
  uploadDate: { type: Date, required: true },
  contentType: { type: String, required: true },
  file: { type: Buffer, required: true },
});

const File = mongoose.model<IFileDocument>('File', FileSchema);

export default File;
