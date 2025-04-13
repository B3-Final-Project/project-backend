import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwkPem from 'jwk-to-pem';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
import * as process from 'node:process';

@Injectable()
export class CognitoStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly cognitoIssuer: string;
  private pems: { [key: string]: string } = {};
  private readonly cognitoUserPoolID = process.env.COGNITO_USER_POOL_ID;

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        const decodedToken = jwt.decode(rawJwtToken, { complete: true });
        const kid = decodedToken?.header.kid;
        const pem = this.pems[kid];
        done(null, pem);
      },
    });
    this.cognitoIssuer = `https://cognito-idp.eu-west-3.amazonaws.com/${this.cognitoUserPoolID}`;
    this.loadPems();
  }

  private loadPems = async () => {
    const url = `${this.cognitoIssuer}/.well-known/jwks.json`;
    const { data } = await axios.get(url);
    data.keys.forEach((key) => {
      this.pems[key.kid] = jwkPem(key);
    });
  };

  async validate(payload: any) {
    return {
      userId: payload.sub,
      username: payload['cognito:username'],
      roles: payload['cognito:groups'] ?? [],
    };
  }
}
