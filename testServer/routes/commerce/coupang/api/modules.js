const getContract = require("./getContract");

const isIdPwError = async (queryData, idpwError) => {
  if (queryData.id && queryData.pw) {
    const coupang_id = queryData.id;
    const coupang_pw = queryData.pw;

    //쿠팡wing 로그인 페이지
    await page.goto("https://wing.coupang.com/login");

    //아이디랑 비밀번호 란에 값을 넣기
    await page.evaluate(
      (id, pw) => {
        document.querySelector('input[name="username"]').value = id;
        document.querySelector('input[name="password"]').value = pw;
      },
      coupang_id,
      coupang_pw
    );

    //로그인
    await page.click('input[name="login"]');

    //idpw 분기처리
    await page.waitForTimeout(3000);
    idpwError = await page.evaluate(() => {
      //idpw에러 판단
      let check = document.querySelector('span[id="input-error"]') !== null;
      return check; //오류:정상
    });
    console.log("idpwError:" + idpwError);
    return idpwError;
  }
};

const isDashError = async (idpwError) => {
  if (idpwError == false) {
    //idpw분기처리

    dashError = await page.evaluate(async () => {
      //대시보드 에러 판단
      return (
        document.querySelector('button[id="top-header-hamburger"]') !== null
      );
    });

    console.log("dashError:" + dashError);
    return dashError;
  }
  return false;
};

const isCalculationExists = async (dashError) => {
  if (dashError) {
    //아이디비번이 정상이지만 접속로그때문에 대시보드로 바로 진입할때
    await page.goto(
      "https://wing.coupang.com/tenants/finance/wing/contentsurl/dashboard"
    ); //정산현황페이지로 이동

    await page.waitForTimeout(2000); //로드되는 시간을 기다려준다

    calculateExist = await page.evaluate(async () => {
      //정산현황 여부 판단
      return (
        document.querySelector(
          "#seller-dashboard > div.dashboard-widget > div > strong:nth-child(3) > a"
        ) !== null
      );
    });
    return calculateExist;
  }
  return false;
};

const isAuthError = async (queryData) => {
  if (queryData.code) {
    const coupang_code = queryData.code;
    await page.evaluate((code) => {
      document.querySelector('input[name="code"]').value = code;
    }, coupang_code);
    //인증하기
    await page.click("#mfa-submit");
    //인증번호 분기처리
    await page.waitForTimeout(2000);
    authError = await page.evaluate(() => {
      return document.querySelector('span[id="input-error"]') == null;
    });
    return authError;
  }
  return false;
};

const getSettlement = async (req, calculateExist) => {
  if (calculateExist) {
    await page.waitForTimeout(2000);
    let data = await page.evaluate(async () => {
      const calculation = document.querySelector(
        "#seller-dashboard > div.dashboard-widget > div > strong:nth-child(3) > a"
      );
      const expectedDate = document.querySelector(
        'strong[id="expectedPayDate"]'
      );
      return [calculation.textContent, expectedDate.textContent];
    });
    let stDate = new Date();
    let endDate = new Date(data[1]);
    let btDay = parseInt(
      (endDate.getTime() - stDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    let fee = parseInt(
      parseFloat(data[0].replace(/,/g, "")) * (0.0004 * btDay)
    );
    console.log("ok");
    res.json({
      price: data[0] - getContract(req),
      deadline: data[1],
      btDay: btDay,
      fee: fee,
    });
    return;
  }
};

module.exports = {
  isIdPwError,
  isDashError,
  isAuthError,
  isCalculationExists,
  getSettlement,
};