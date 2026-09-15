# AWS hosting

This stack creates a new private, versioned S3 bucket and CloudFront distribution. Both S3 deletion policies are `Retain`; removing the stack does not delete generated sites. It does not inspect, import, or modify existing Aderet infrastructure.

## 1. Create an isolated stack

Start without a custom domain:

```bash
aws cloudformation deploy \
  --stack-name aderet-prospect-sites \
  --template-file infrastructure/template.yaml
```

Read the outputs, then export them locally:

```bash
aws cloudformation describe-stacks \
  --stack-name aderet-prospect-sites \
  --query 'Stacks[0].Outputs'

export ADERET_BUCKET='<BucketName output>'
export ADERET_DISTRIBUTION_ID='<DistributionId output>'
export ADERET_PUBLIC_URL='<DistributionUrl output>'
```

Deploy the dashboard with `npm run deploy:main`. Prospect builds are uploaded only below `preview/<id>/`.

## 2. Add aderet.tech deliberately

Do this only after verifying the new CloudFront URL. Request or reuse an ACM certificate in **us-east-1** that covers the exact hostname. Update the stack with both parameters:

```bash
aws cloudformation deploy \
  --stack-name aderet-prospect-sites \
  --template-file infrastructure/template.yaml \
  --parameter-overrides DomainName=aderet.tech CertificateArn='<us-east-1 certificate ARN>'
```

CloudFormation will configure CloudFront, but it intentionally does not touch Route 53. After the distribution is deployed, manually change the `A`/`AAAA` alias for `aderet.tech` to this distribution. Inspect the current DNS and existing S3/CloudFront site first; DNS cutover replaces what visitors see at the root domain.

## Layout

```text
s3://<bucket>/index.html
s3://<bucket>/assets/*
s3://<bucket>/prospects.json
s3://<bucket>/preview/<id>/index.html
s3://<bucket>/preview/<id>/assets/*
```

The CloudFront viewer-request function resolves directory paths to `index.html`, including `/preview/<id>/`.

