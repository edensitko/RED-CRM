import * as functions from 'firebase-functions';
import * as cors from 'cors';
import fetch from 'node-fetch';

const corsHandler = cors({ origin: true });

export const downloadFile = functions.https.onRequest(async (request, response) => {
  corsHandler(request, response, async () => {
    try {
      const { url, filename } = request.body;

      if (!url || !filename) {
        response.status(400).send('Missing URL or filename');
        return;
      }

      // Fetch the file
      const fileResponse = await fetch(url);
      const buffer = await fileResponse.buffer();

      // Set headers for download
      response.setHeader('Content-Type', 'application/octet-stream');
      response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      response.setHeader('Content-Length', buffer.length);

      // Send the file
      response.send(buffer);
    } catch (error) {
      console.error('Error downloading file:', error);
      response.status(500).send('Error downloading file');
    }
  });
});
