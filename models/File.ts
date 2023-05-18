import mongoose, { Schema } from 'mongoose';
import { IFileDocument } from '../objecttypes/modelTypes';

const FileSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  creator: { type: String, required: true },
  uploadDate: { type: Date, required: true },
  file: {
    data: Buffer,
    contentType: String,
  },
});

const File = mongoose.model<IFileDocument>('File', FileSchema);

export default File;
