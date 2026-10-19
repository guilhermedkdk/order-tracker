package io.github.guilhermedkdk.ordertracker;

import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import java.io.UnsupportedEncodingException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MockMvcTester.MockMvcRequestBuilder;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

/**
 * Talks to the API the way the SPA does: it keeps the cookies between requests and echoes the CSRF
 * cookie in the {@code X-XSRF-TOKEN} header on every request that changes data.
 */
public final class ApiSession {

    private static final String CSRF_COOKIE = "XSRF-TOKEN";
    private static final String CSRF_HEADER = "X-XSRF-TOKEN";

    private final MockMvcTester mvc;
    private final Map<String, String> cookies = new LinkedHashMap<>();

    public ApiSession(MockMvcTester mvc) {
        this.mvc = mvc;
    }

    /** An e-mail no other test uses, since every test shares one database. */
    public static String uniqueEmail() {
        return "user-" + UUID.randomUUID() + "@example.com";
    }

    /** Reads one value of a JSON answer, such as the id of what was just created. */
    public static String read(MvcTestResult result, String jsonPath) {
        try {
            return String.valueOf(JsonPath.<Object>read(result.getResponse().getContentAsString(), jsonPath));
        } catch (UnsupportedEncodingException e) {
            throw new IllegalStateException(e);
        }
    }

    public MvcTestResult get(String uri) {
        return send(mvc.get().uri(uri), false);
    }

    public MvcTestResult post(String uri) {
        return send(mvc.post().uri(uri), true);
    }

    public MvcTestResult post(String uri, String json) {
        return send(mvc.post().uri(uri).contentType(MediaType.APPLICATION_JSON).content(json), true);
    }

    public MvcTestResult patch(String uri, String json) {
        return send(mvc.patch().uri(uri).contentType(MediaType.APPLICATION_JSON).content(json), true);
    }

    /** Signs up a new owner and keeps the session. */
    public MvcTestResult signup(String name, String email, String password) {
        return post("/api/auth/signup", """
                {"name": "%s", "email": "%s", "password": "%s"}
                """.formatted(name, email, password));
    }

    /** The value of a cookie this browser holds now, or {@code null}. */
    public String cookie(String name) {
        return cookies.get(name);
    }

    public void setCookie(String name, String value) {
        cookies.put(name, value);
    }

    public void forgetCookie(String name) {
        cookies.remove(name);
    }

    private MvcTestResult send(MockMvcRequestBuilder request, boolean changesData) {
        if (changesData && !cookies.containsKey(CSRF_COOKIE)) {
            // The SPA loads /api/auth/me before anything else, which hands it the CSRF cookie.
            get("/api/auth/me");
        }
        cookies.forEach((name, value) -> request.cookie(new Cookie(name, value)));
        if (changesData && cookies.containsKey(CSRF_COOKIE)) {
            request.header(CSRF_HEADER, cookies.get(CSRF_COOKIE));
        }
        MvcTestResult result = request.exchange();
        for (Cookie cookie : result.getResponse().getCookies()) {
            if (cookie.getMaxAge() == 0) {
                cookies.remove(cookie.getName());
            } else {
                cookies.put(cookie.getName(), cookie.getValue());
            }
        }
        return result;
    }
}
