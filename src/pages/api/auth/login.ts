import { NextApiRequest, NextApiResponse } from 'next';
import { handleLogin } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleLogin(req, res);
}