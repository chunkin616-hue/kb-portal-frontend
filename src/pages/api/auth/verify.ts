import { NextApiRequest, NextApiResponse } from 'next';
import { handleVerify } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleVerify(req, res);
}